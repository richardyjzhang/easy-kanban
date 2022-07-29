package com.zhangrichard.easykanban.organization;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface OrganizationMapper {

    @Select("SELECT * FROM organization WHERE deleted = 0")
    List<Organization> getOrganizations();
}
