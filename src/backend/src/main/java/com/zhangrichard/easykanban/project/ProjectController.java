package com.zhangrichard.easykanban.project;

import com.zhangrichard.easykanban.organization.Organization;
import com.zhangrichard.easykanban.organization.OrganizationMapper;
import com.zhangrichard.easykanban.security.AuthUtils;
import com.zhangrichard.easykanban.security.entity.LoginUser;
import com.zhangrichard.easykanban.utils.IdWorker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

@RestController
public class ProjectController {

    @Autowired
    AuthUtils authUtils;

    @Autowired
    ProjectMapper projectMapper;

    @Autowired
    OrganizationMapper organizationMapper;

    @Autowired
    IdWorker idWorker;

    @GetMapping("/projects")
    public List<Project> getProjects() {

        LoginUser user = authUtils.currentUser();
        Long orgId = null;
        if (!user.getSysAdmin()) {
            orgId = user.getOrgId();
        }

        List<Project> projects = projectMapper.getProjects(orgId);
        return projects;
    }

    @PostMapping("/projects")
    public Project addProject(
            @RequestBody Project project, HttpServletResponse response) {

        // 名字必填
        String name = project.getName();
        if (name == null || name.isBlank()) {
            response.setStatus(400);
            return null;
        }

        // 名字不允许重复
        Integer cnt = projectMapper.countProjects(name);
        if (cnt > 0) {
            response.setStatus(400);
            return null;
        }

        // 非管理员仅能新增自己组织项目
        LoginUser user = authUtils.currentUser();
        if (!user.getSysAdmin()) {
            Long userOrgId = user.getOrgId();
            if (!userOrgId.equals(project.getOrgId())) {
                response.setStatus(403);
                return null;
            }

            // 补充组织名称
            project.setOrgName(user.getOrgName());
        } else {
            if (project.getOrgId().equals(user.getOrgId())) {
                project.setOrgName(user.getOrgName());
            } else {
                List<Organization> organizations =
                        organizationMapper.getOrganizations(project.getOrgId());
                if (organizations.size() == 1) {
                    project.setOrgName(organizations.get(0).getName());
                } else {
                    response.setStatus(400);
                    return null;
                }
            }
        }

        // 生成ID
        Long id = idWorker.nextId();
        project.setId(id);

        // 插入数据库
        projectMapper.addProject(project);

        return project;
    }

    @DeleteMapping("/projects/{id}")
    public void deleteProject(
            @PathVariable(name="id") Long id, HttpServletResponse response) {

        if (!authUtils.hasAuthProject(id)) {
            response.setStatus(403);
            return;
        }

        projectMapper.deleteProject(id);
    }

    @PutMapping("/projects/{id}")
    public Project updateProject(
            @PathVariable(name="id") Long id,
            @RequestBody Project project,
            HttpServletResponse response) {

        if (!authUtils.hasAuthProject(id)) {
            response.setStatus(403);
            return null;
        }

        // 查找修改前的数据
        Project original = projectMapper.getOneProject(id);
        if (original == null) {
            response.setStatus(400);
            return null;
        }

        // 名字不允许重复
        Integer cnt = projectMapper.countProjects(project.getName());
        if (!project.getName().equals(original.getName()) && cnt > 0) {
            response.setStatus(400);
            return null;
        }

        project.setId(id);
        projectMapper.updateProject(project);

        return project;
    }

}
