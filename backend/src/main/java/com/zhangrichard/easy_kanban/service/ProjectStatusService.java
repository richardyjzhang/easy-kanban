package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.ProjectStatus;

import java.util.ArrayList;

public interface ProjectStatusService {
    ArrayList<ProjectStatus> findAllProjectStatus();
    ProjectStatus addOneProjectStatus(ProjectStatus projectStatus);
    ProjectStatus updateOneProjectStatus(ProjectStatus projectStatus, String id);
    void deleteOneProjectStatus(String id);
}
