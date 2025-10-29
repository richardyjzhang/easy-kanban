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
    ProjectRepository ProjectRepository;

    @Override
    public ArrayList<Project> findAllProject() {
        return (ArrayList<Project>) ProjectRepository.findAll();
    }

    @Override
    public Project addOneProject(Project project) {
        Project newProject = ProjectRepository.save(project);
        return newProject;
    }

    @Override
    public Project updateOneProject(Project project, String id) {
        Optional<Project> _project = ProjectRepository.findById(id);
        if (_project.isPresent()) {
            project.setId(id);
            ProjectRepository.save(project);
        }
        return project;
    }

    @Override
    public void deleteOneProject(String id) {
        ProjectRepository.deleteById(id);
    }
}
