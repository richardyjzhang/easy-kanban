package com.zhangrichard.easy_kanban.repository;

import com.zhangrichard.easy_kanban.model.ProjectLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectLogRepository extends JpaRepository<ProjectLog, String> {
    List<ProjectLog> findAllByProjectIdOrderByTimeAsc(String projectId);
}
