package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.document.DocumentPreviewDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class DocumentPreviewService {
    public DocumentPreviewDto buildPreview(Long documentId, String fileName, String fileType, byte[] content) {
        String extension = extension(fileName);
        String type = fileType == null ? "" : fileType.toLowerCase();

        if (type.startsWith("text/") || List.of("txt", "md", "csv").contains(extension)) {
            return new DocumentPreviewDto(documentId, "text", new String(content, StandardCharsets.UTF_8), "");
        }

        if ("docx".equals(extension)) {
            return new DocumentPreviewDto(documentId, "office-text", extractDocxText(content), "Extracted from Word document");
        }

        if ("pptx".equals(extension)) {
            return new DocumentPreviewDto(documentId, "office-text", extractPptxText(content), "Extracted from PowerPoint slides");
        }

        if ("doc".equals(extension)) {
            return new DocumentPreviewDto(documentId, "office-text", extractReadableBinaryText(content), "Extracted from legacy Word document");
        }

        throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Preview is not available for this file type");
    }

    private String extractDocxText(byte[] content) {
        List<String> paragraphs = new ArrayList<>();
        readZipEntries(content).stream()
                .filter(entry -> entry.name().endsWith("word/document.xml")
                        || entry.name().contains("word/header")
                        || entry.name().contains("word/footer"))
                .forEach(entry -> paragraphs.addAll(extractParagraphs(entry.content())));
        return requireContent(String.join("\n\n", paragraphs));
    }

    private String extractPptxText(byte[] content) {
        List<ZipTextEntry> slides = readZipEntries(content).stream()
                .filter(entry -> entry.name().contains("ppt/slides/slide") && entry.name().endsWith(".xml"))
                .sorted(Comparator.comparing(ZipTextEntry::name))
                .toList();

        List<String> slideTexts = new ArrayList<>();
        for (int i = 0; i < slides.size(); i++) {
            String slideText = String.join("\n", extractTextNodes(slides.get(i).content()));
            if (!slideText.isBlank()) {
                slideTexts.add("Slide " + (i + 1) + "\n" + slideText);
            }
        }
        return requireContent(String.join("\n\n", slideTexts));
    }

    private List<ZipTextEntry> readZipEntries(byte[] content) {
        List<ZipTextEntry> entries = new ArrayList<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(content))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    entries.add(new ZipTextEntry(entry.getName().replace('\\', '/'), zip.readAllBytes()));
                }
            }
            return entries;
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "This Office file could not be read");
        }
    }

    private List<String> extractParagraphs(byte[] xmlContent) {
        List<String> paragraphs = new ArrayList<>();
        try {
            var factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            var document = factory.newDocumentBuilder().parse(new ByteArrayInputStream(xmlContent));
            NodeList paragraphNodes = document.getElementsByTagNameNS("*", "p");

            for (int i = 0; i < paragraphNodes.getLength(); i++) {
                NodeList textNodes = paragraphNodes.item(i).getChildNodes();
                StringBuilder paragraph = new StringBuilder();
                collectText(textNodes, paragraph);
                String text = paragraph.toString().trim();
                if (!text.isBlank()) {
                    paragraphs.add(text);
                }
            }

            if (paragraphs.isEmpty()) {
                paragraphs.addAll(extractTextNodes(xmlContent));
            }
            return paragraphs;
        } catch (Exception exception) {
            return extractTextNodes(xmlContent);
        }
    }

    private List<String> extractTextNodes(byte[] xmlContent) {
        List<String> values = new ArrayList<>();
        try {
            var factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            var document = factory.newDocumentBuilder().parse(new ByteArrayInputStream(xmlContent));
            NodeList textNodes = document.getElementsByTagNameNS("*", "t");
            for (int i = 0; i < textNodes.getLength(); i++) {
                String text = textNodes.item(i).getTextContent().trim();
                if (!text.isBlank()) {
                    values.add(text);
                }
            }
            return values;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "This Office file could not be parsed");
        }
    }

    private void collectText(NodeList nodes, StringBuilder output) {
        for (int i = 0; i < nodes.getLength(); i++) {
            var node = nodes.item(i);
            if ("t".equals(node.getLocalName())) {
                output.append(node.getTextContent());
            } else if ("tab".equals(node.getLocalName())) {
                output.append("\t");
            } else if ("br".equals(node.getLocalName())) {
                output.append("\n");
            }
            if (node.hasChildNodes()) {
                collectText(node.getChildNodes(), output);
            }
        }
    }

    private String extractReadableBinaryText(byte[] content) {
        StringBuilder text = new StringBuilder();
        StringBuilder currentWord = new StringBuilder();
        for (byte item : content) {
            int value = item & 0xff;
            if ((value >= 32 && value <= 126) || value == 9 || value == 10 || value == 13) {
                currentWord.append((char) value);
            } else {
                flushWord(text, currentWord);
            }
        }
        flushWord(text, currentWord);
        return requireContent(text.toString().replaceAll("[ \\t]{3,}", " ").trim());
    }

    private void flushWord(StringBuilder text, StringBuilder currentWord) {
        if (currentWord.length() >= 3) {
            if (!text.isEmpty()) {
                text.append(' ');
            }
            text.append(currentWord);
        }
        currentWord.setLength(0);
    }

    private String requireContent(String text) {
        if (text == null || text.isBlank()) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "No readable preview content was found in this file");
        }
        return text;
    }

    private String extension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    private record ZipTextEntry(String name, byte[] content) {
    }
}
