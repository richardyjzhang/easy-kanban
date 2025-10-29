package com.zhangrichard.easy_kanban.controller;

import com.zhangrichard.easy_kanban.model.Employee;
import com.zhangrichard.easy_kanban.model.Project;
import com.zhangrichard.easy_kanban.model.ProjectEmployee;
import com.zhangrichard.easy_kanban.model.ProjectEmployeeId;
import com.zhangrichard.easy_kanban.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProjectController {

    @Autowired
    ProjectService projectService;

    @GetMapping("/projects")
    public List<Project> getAllProject() {
        return projectService.findAllProject();
    }

    @PostMapping("/projects")
    public Project addOneProject(@RequestBody Project project) {
        Project newProject = projectService.addOneProject(project);
        return newProject;
    }

    @PutMapping("/projects/{id}")
    public ResponseEntity<Project> updateOneProject(@RequestBody Project project, @PathVariable String id) {
        Project newProject = projectService.updateOneProject(project, id);
        if (newProject.getId() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(newProject);
    }

    @DeleteMapping("/projects/{id}")
    public void deleteOneProject(@PathVariable String id) {
        projectService.deleteOneProject(id);
    }

    @GetMapping("/projects/employees/{id}")
    public List<Employee> getOneProjectEmployee(@PathVariable String id) {
        List<Employee> employees = projectService.findOneProjectEmployee(id);
        return employees;
    }

    @PutMapping("/projects/employees/{id}")
    public List<ProjectEmployee> setOneProjectEmployee(@PathVariable String id, @RequestBody List<String> employeeIds) {
        return projectService.setOneProjectEmployee(id, employeeIds);
    }
}
