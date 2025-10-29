package com.zhangrichard.easy_kanban.controller;

import com.zhangrichard.easy_kanban.model.Project;
import com.zhangrichard.easy_kanban.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class ProjectController {

    @Autowired
    ProjectService ProjectService;

    @GetMapping("/projects")
    public ArrayList<Project> getAllProject() {
        return ProjectService.findAllProject();
    }

    @PostMapping("/projects")
    public Project addOneProject(@RequestBody Project project) {
        Project newProject = ProjectService.addOneProject(project);
        return newProject;
    }

    @PutMapping("/projects/{id}")
    public ResponseEntity<Project> updateOneProject(@RequestBody Project project, @PathVariable String id) {
        Project newProject = ProjectService.updateOneProject(project, id);
        if (newProject.getId() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(newProject);
    }

    @DeleteMapping("/projects/{id}")
    public void deleteOneProject(@PathVariable String id) {
        ProjectService.deleteOneProject(id);
    }
}
