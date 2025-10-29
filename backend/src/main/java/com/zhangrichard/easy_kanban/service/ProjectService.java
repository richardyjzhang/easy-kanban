package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Employee;
import com.zhangrichard.easy_kanban.model.Project;
import com.zhangrichard.easy_kanban.model.ProjectEmployee;

import java.util.List;

public interface ProjectService {
    List<Project> findAllProject();
    Project addOneProject(Project project);
    Project updateOneProject(Project project, String id);
    void deleteOneProject(String id);

    List<Employee> findOneProjectEmployee(String id);
    List<ProjectEmployee> setOneProjectEmployee(String projectId, List<String> employeeIds);
}
