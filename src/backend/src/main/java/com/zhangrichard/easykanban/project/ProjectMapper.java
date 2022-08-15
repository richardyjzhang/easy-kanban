package com.zhangrichard.easykanban.project;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProjectMapper {

    @Select("<script> " +
            "SELECT p.id, p.name, p.remark, o.id AS orgId, o.name AS orgName " +
            "FROM project p LEFT JOIN organization o ON p.orgId = o.id " +
            "WHERE p.deleted = 0 AND o.deleted = 0 " +
            "<if test='orgId != null'>" +
            "  AND o.id = #{orgId} " +
            "</if>" +
            "</script>")
    List<Project> getProjects(Long orgId);
}
