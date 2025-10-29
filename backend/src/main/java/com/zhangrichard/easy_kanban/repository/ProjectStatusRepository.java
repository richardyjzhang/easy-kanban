package com.zhangrichard.easy_kanban.repository;

import com.zhangrichard.easy_kanban.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectStatusRepository extends JpaRepository<ProjectStatus, String> {

}
