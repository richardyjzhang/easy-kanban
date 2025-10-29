package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.ProjectStatus;
import com.zhangrichard.easy_kanban.repository.ProjectStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class ProjectStatusServiceImpl implements ProjectStatusService {

    @Autowired
    ProjectStatusRepository ProjectStatusRepository;

    @Override
    public ArrayList<ProjectStatus> findAllProjectStatus() {
        return (ArrayList<ProjectStatus>) ProjectStatusRepository.findAll();
    }

    @Override
    public ProjectStatus addOneProjectStatus(ProjectStatus projectStatus) {
        ProjectStatus newProjectStatus = ProjectStatusRepository.save(projectStatus);
        return newProjectStatus;
    }

    @Override
    public ProjectStatus updateOneProjectStatus(ProjectStatus projectStatus, String id) {
        projectStatus.setId(id);
        ProjectStatusRepository.save(projectStatus);
        return projectStatus;
    }

    @Override
    public void deleteOneProjectStatus(String id) {
        ProjectStatusRepository.deleteById(id);
    }
}
