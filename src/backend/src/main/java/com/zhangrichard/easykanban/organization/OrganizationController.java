package com.zhangrichard.easykanban.organization;

import com.zhangrichard.easykanban.security.entity.LoginUser;
import com.zhangrichard.easykanban.utils.IdWorker;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

@RestController
public class OrganizationController {

    @Autowired
    OrganizationMapper  organizationMapper;

    @Autowired
    IdWorker idWorker;

    @GetMapping("/organizations")
    public List<Organization> getOrganizations(HttpServletResponse response) {
        // 该接口仅允许系统管理员访问
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        if (!user.getSysAdmin()) {
            response.setStatus(403);
            return null;
        }

        List<Organization> organizations = organizationMapper.getOrganizations();
        return organizations;
    }

    @PostMapping("/organizations")
    public Organization addOrganization(
            @RequestBody Organization organization, HttpServletResponse response) {
        // 该接口仅允许系统管理员访问
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        if (!user.getSysAdmin()) {
            response.setStatus(403);
            return null;
        }

        // 名字必填
        String name = organization.getName();
        if (name == null || name.isBlank()) {
            response.setStatus(400);
            return null;
        }

        // 名字不允许重复
        Integer cnt = organizationMapper.countOrganizations(organization.getName());
        if (cnt > 0) {
            response.setStatus(400);
            return null;
        }

        // 生成ID
        Long id = idWorker.nextId();
        organization.setId(id);

        // 插入数据库
        organizationMapper.addOrganization(organization);

        return organization;
    }

    @DeleteMapping("/organizations/{id}")
    public void deleteOrganization(
            @PathVariable(name="id") Long id, HttpServletResponse response) {
        // 该接口仅允许系统管理员访问
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        if (!user.getSysAdmin()) {
            response.setStatus(403);
            return;
        }

        organizationMapper.deleteOrganization(id);
    }

    @PutMapping("/organizations/{id}")
    public Organization updateOrganization(
            @PathVariable(name="id") Long id,
            @RequestBody Organization organization,
            HttpServletResponse response) {
        // 该接口仅允许系统管理员访问
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        if (!user.getSysAdmin()) {
            response.setStatus(403);
            return null;
        }

        // 查找修改前的数据
        Organization original = organizationMapper.getOneOrganizations(id);
        if (original == null) {
            response.setStatus(400);
            return null;
        }

        // 名字不允许重复
        Integer cnt = organizationMapper.countOrganizations(organization.getName());
        if (!organization.getName().equals(original.getName()) && cnt > 0) {
            response.setStatus(400);
            return null;
        }

        organization.setId(id);
        organizationMapper.updateOrganization(organization);

        return organization;
    }
}
