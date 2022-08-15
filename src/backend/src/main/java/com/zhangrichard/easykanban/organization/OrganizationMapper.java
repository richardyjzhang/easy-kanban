package com.zhangrichard.easykanban.organization;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface OrganizationMapper {

    @Select("<script> " +
            "SELECT * FROM organization WHERE deleted = 0 " +
            "<if test='id != null'> " +
            "  AND id = #{id} " +
            "</if> " +
            "</script>")
    List<Organization> getOrganizations(Long id);

    @Select("SELECT * FROM organization WHERE id = #{id} AND deleted = 0")
    Organization getOneOrganizations(Long id);

    @Select("SELECT COUNT(1) FROM organization WHERE " +
            "name = #{name} AND deleted = 0")
    Integer countOrganizations(String name);

    @Insert("INSERT INTO organization (id, name, remark) " +
            "VALUES " +
            "(#{id}, #{name}, #{remark}) ")
    void addOrganization(Organization organization);

    @Update("UPDATE organization SET deleted = 1 WHERE id = #{id}")
    void deleteOrganization(Long id);

    @Update("UPDATE organization SET name = #{name}, remark = #{remark} " +
            "WHERE id = #{id} AND deleted = 0")
    void updateOrganization(Organization organization);
}
