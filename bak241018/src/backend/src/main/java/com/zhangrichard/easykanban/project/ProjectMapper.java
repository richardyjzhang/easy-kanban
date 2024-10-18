package com.zhangrichard.easykanban.project;

import com.zhangrichard.easykanban.organization.Organization;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

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

    @Select("SELECT * FROM project WHERE id = #{id} AND deleted = 0")
    Project getOneProject(Long id);

    @Select("SELECT COUNT(1) FROM project WHERE " +
            "name = #{name} AND deleted = 0")
    Integer countProjects(String name);

    @Insert("INSERT INTO project (id, orgId, name, remark) " +
            "VALUES " +
            "(#{id}, #{orgId}, #{name}, #{remark}) ")
    void addProject(Project project);

    @Update("UPDATE project SET deleted = 1 WHERE id = #{id}")
    void deleteProject(Long id);

    @Update("UPDATE project SET name = #{name}, remark = #{remark} " +
            "WHERE id = #{id} AND deleted = 0")
    void updateProject(Project project);
}
