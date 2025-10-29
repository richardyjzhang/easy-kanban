package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.ProjectStatus;
import com.zhangrichard.easy_kanban.repository.ProjectStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class ProjectStatusServiceImpl implements ProjectStatusService {

    @Autowired
    ProjectStatusRepository projectStatusRepository;

    @Override
    public ArrayList<ProjectStatus> findAllProjectStatus() {
        return (ArrayList<ProjectStatus>) projectStatusRepository.findAll();
    }

    @Override
    public ProjectStatus addOneProjectStatus(ProjectStatus projectStatus) {
        ProjectStatus newProjectStatus = projectStatusRepository.save(projectStatus);
        return newProjectStatus;
    }

    @Override
    public ProjectStatus updateOneProjectStatus(ProjectStatus projectStatus, String id) {
        Optional<ProjectStatus> _status = projectStatusRepository.findById(id);
        if (_status.isPresent()) {
            projectStatus.setId(id);
            projectStatusRepository.save(projectStatus);
        }
        return projectStatus;
    }

    @Override
    public void deleteOneProjectStatus(String id) {
        projectStatusRepository.deleteById(id);
    }
}
