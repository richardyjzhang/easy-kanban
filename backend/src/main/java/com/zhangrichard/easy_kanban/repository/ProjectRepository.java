package com.zhangrichard.easy_kanban.repository;

import com.zhangrichard.easy_kanban.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

}
