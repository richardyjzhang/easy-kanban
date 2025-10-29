package com.zhangrichard.easy_kanban.controller;

import com.zhangrichard.easy_kanban.model.ProjectStatus;
import com.zhangrichard.easy_kanban.service.ProjectStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class ProjectStatusController {

    @Autowired
    ProjectStatusService ProjectStatusService;

    @GetMapping("/project-status")
    public ArrayList<ProjectStatus> getAllProjectStatus() {
        return ProjectStatusService.findAllProjectStatus();
    }

    @PostMapping("/project-status")
    public ProjectStatus addOneProjectStatus(@RequestBody ProjectStatus projectStatus) {
        ProjectStatus newProjectStatus = ProjectStatusService.addOneProjectStatus(projectStatus);
        return newProjectStatus;
    }

    @PutMapping("/project-status/{id}")
    public ResponseEntity<ProjectStatus> updateOneProjectStatus(@RequestBody ProjectStatus projectStatus, @PathVariable String id) {
        ProjectStatus newProjectStatus = ProjectStatusService.updateOneProjectStatus(projectStatus, id);
        if (newProjectStatus.getId() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(newProjectStatus);
    }

    @DeleteMapping("/project-status/{id}")
    public void deleteOneProjectStatus(@PathVariable String id) {
        ProjectStatusService.deleteOneProjectStatus(id);
    }
}
