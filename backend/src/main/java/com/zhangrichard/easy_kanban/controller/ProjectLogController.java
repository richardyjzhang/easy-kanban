package com.zhangrichard.easy_kanban.controller;

import com.zhangrichard.easy_kanban.model.ProjectLog;
import com.zhangrichard.easy_kanban.service.ProjectLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class ProjectLogController {

    @Autowired
    ProjectLogService projectLogService;

    @GetMapping("/projects/logs")
    public ArrayList<ProjectLog> getOneProjectAllLogs(
            @RequestParam(value = "projectId", required = true) String projectId) {
        return projectLogService.findAllProjectLog(projectId);
    }

    @PostMapping("/projects/logs")
    public ProjectLog addOneProjectLog(@RequestBody ProjectLog projectLog) {
        ProjectLog newLog = projectLogService.addOneProjectLog(projectLog);
        return newLog;
    }

    @PutMapping("/projects/logs/{id}")
    public ResponseEntity<ProjectLog> updateOneProjectLog(@RequestBody ProjectLog projectLog, @PathVariable String id) {
        ProjectLog newLog = projectLogService.updateOneProjectLog(projectLog, id);
        if (newLog.getId() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(newLog);
    }

    @DeleteMapping("/projects/logs/{id}")
    public void deleteOneProjectLog(@PathVariable String id) {
        projectLogService.deleteOneProjectLog(id);
    }
}
