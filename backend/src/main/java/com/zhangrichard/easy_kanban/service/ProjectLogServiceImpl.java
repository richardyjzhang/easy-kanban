package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.ProjectLog;
import com.zhangrichard.easy_kanban.repository.ProjectLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class ProjectLogServiceImpl implements ProjectLogService {

    @Autowired
    ProjectLogRepository projectLogRepository;

    @Override
    public ArrayList<ProjectLog> findAllProjectLog(String projectId) {
        return (ArrayList<ProjectLog>) projectLogRepository.findAllByProjectIdOrderByTimeAsc(projectId);
    }

    @Override
    public ProjectLog addOneProjectLog(ProjectLog projectLog) {
        ProjectLog newProjectLog = projectLogRepository.save(projectLog);
        return newProjectLog;
    }

    @Override
    public ProjectLog updateOneProjectLog(ProjectLog projectLog, String id) {
        Optional<ProjectLog> _projectLog = projectLogRepository.findById(id);
        if (_projectLog.isPresent()) {
            projectLog.setId(id);
            // 不允许修改项目
            projectLog.setProjectId(_projectLog.get().getProjectId());
            projectLogRepository.save(projectLog);
        }
        return projectLog;
    }

    @Override
    public void deleteOneProjectLog(String id) {
        projectLogRepository.deleteById(id);
    }
}
