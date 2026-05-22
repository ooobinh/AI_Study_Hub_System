package com.aistudyhub.controller;

import com.aistudyhub.dto.subject.CreateSubjectRequest;
import com.aistudyhub.dto.subject.SubjectDto;
import com.aistudyhub.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public List<SubjectDto> list(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String search
    ) {
        return subjectService.list(userId, search);
    }

    @GetMapping("/{id}")
    public SubjectDto find(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        return subjectService.findById(id, userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubjectDto create(@RequestParam Long userId, @Valid @RequestBody CreateSubjectRequest request) {
        return subjectService.create(request, userId);
    }
}
