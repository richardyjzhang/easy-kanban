package com.zhangrichard.easykanban.security;


import com.zhangrichard.easykanban.project.Project;
import com.zhangrichard.easykanban.project.ProjectMapper;
import com.zhangrichard.easykanban.security.entity.LoginUser;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AuthUtils {

    @Autowired
    ProjectMapper projectMapper;

    public boolean isSysAdmin() {
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        return user.getSysAdmin();
    }

    public LoginUser currentUser() {
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        return user;
    }

    public boolean hasAuthProject(Long projectId) {
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();

        Project project = projectMapper.getOneProject(projectId);
        if (project == null) {
            return false;
        }

        if (user.getSysAdmin()) {
            return true;
        } else {
            return project.getOrgId().equals(projectId);
        }
    }

}
