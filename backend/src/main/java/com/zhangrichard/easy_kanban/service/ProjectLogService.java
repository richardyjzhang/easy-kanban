package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.ProjectLog;

import java.util.ArrayList;

public interface ProjectLogService {
    ArrayList<ProjectLog> findAllProjectLog(String projectId);
    ProjectLog addOneProjectLog(ProjectLog projectLog);
    ProjectLog updateOneProjectLog(ProjectLog projectLog, String id);
    void deleteOneProjectLog(String id);
}
