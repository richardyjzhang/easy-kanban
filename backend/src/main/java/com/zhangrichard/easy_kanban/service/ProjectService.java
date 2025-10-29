package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Project;

import java.util.ArrayList;

public interface ProjectService {
    ArrayList<Project> findAllProject();
    Project addOneProject(Project project);
    Project updateOneProject(Project project, String id);
    void deleteOneProject(String id);
}
