package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Project;
import com.zhangrichard.easy_kanban.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    ProjectRepository projectRepository;

    @Override
    public ArrayList<Project> findAllProject() {
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
}
