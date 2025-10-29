package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Employee;
import com.zhangrichard.easy_kanban.model.Project;
import com.zhangrichard.easy_kanban.model.ProjectEmployee;
import com.zhangrichard.easy_kanban.model.ProjectEmployeeId;
import com.zhangrichard.easy_kanban.repository.EmployeeRepository;
import com.zhangrichard.easy_kanban.repository.ProjectEmployeeRepository;
import com.zhangrichard.easy_kanban.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    EmployeeRepository employeeRepository;

    @Autowired
    ProjectEmployeeRepository projectEmployeeRepository;

    @Override
    public List<Project> findAllProject() {
        return (ArrayList<Project>) projectRepository.findAll();
    }

    @Override
    public Project addOneProject(Project project) {
        Project newProject = projectRepository.save(project);
        return newProject;
    }

    @Override
    public Project updateOneProject(Project project, String id) {
        Optional<Project> _project = projectRepository.findById(id);
        if (_project.isPresent()) {
            project.setId(id);
            projectRepository.save(project);
        }
        return project;
    }

    @Override
    public void deleteOneProject(String id) {
        projectRepository.deleteById(id);
    }

    @Override
    public List<Employee> findOneProjectEmployee(String id) {
        Optional<Project> project = projectRepository.findById(id);
        if (project.isPresent()) {
            Set<ProjectEmployee> employees = project.get().getProjectEmployees();

            List<String> employeeIds = employees.stream()
                    .map(ProjectEmployee::getId)
                    .map(ProjectEmployeeId::getEmployeeId)
                    .collect(Collectors.toList());
            List<Employee> results = employeeRepository.findAllById(employeeIds);
            return results;
        }
        return new ArrayList<>();
    }

    @Override
    @Transactional
    public List<ProjectEmployee> setOneProjectEmployee(String projectId, List<String> employeeIds) {
        Optional<Project> project = projectRepository.findById(projectId);
        if (!project.isPresent()) {
            return new ArrayList<>();
        }

        // 首先删除既有所有
        projectEmployeeRepository.deleteByIdProjectId(projectId);

        // 再根据设置的批量添加
        List<ProjectEmployee> projectEmployeeList = new ArrayList<>();
        for (String employeeId : employeeIds) {
            Optional<Employee> employee = employeeRepository.findById(employeeId);
            if (employee.isPresent()) {
                projectEmployeeList.add(new ProjectEmployee(projectId, employeeId));
            }
        }
        List<ProjectEmployee> results = _batchAddProjectEmployee(projectEmployeeList);
        return results;
    }

    private List<ProjectEmployee> _batchAddProjectEmployee(List<ProjectEmployee> projectEmployeeList) {
        return projectEmployeeRepository.saveAll(projectEmployeeList);
    }
}
