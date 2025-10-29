package com.zhangrichard.easy_kanban.repository;

import com.zhangrichard.easy_kanban.model.ProjectEmployee;
import com.zhangrichard.easy_kanban.model.ProjectEmployeeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ProjectEmployeeRepository extends JpaRepository<ProjectEmployee, ProjectEmployeeId> {

    @Transactional
    void deleteByIdProjectId(String projectId);
}
