package com.zhangrichard.easykanban.security.config;

import org.apache.commons.collections.map.HashedMap;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.mgt.SessionsSecurityManager;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.servlet.Filter;
import java.util.Map;

@Configuration
public class MyShiroConfig {

    @Bean
    public HashedCredentialsMatcher hashedCredentialsMatcher() {
        HashedCredentialsMatcher matcher = new HashedCredentialsMatcher();
        matcher.setHashAlgorithmName("SHA-256");
        matcher.setStoredCredentialsHexEncoded(true);
        return matcher;
    }

    @Bean
    MyRealm myRealm() {
        MyRealm realm = new MyRealm();
        realm.setAuthenticationCachingEnabled(false);
        realm.setCredentialsMatcher(hashedCredentialsMatcher());
        return realm;
    }

    @Bean
    SessionsSecurityManager securityManager() {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(myRealm());
        return securityManager;
    }

    @Bean
    ShiroFilterFactoryBean shiroFilterFactoryBean() {
        ShiroFilterFactoryBean bean = new ShiroFilterFactoryBean();

        // 设定自定义filter
        Map<String, Filter> filters = new HashedMap();
        filters.put("authc", new MyAuthenticationFilter());
        bean.setFilters(filters);

        // 设定路由规则
        Map<String, String> definitions = new HashedMap();
        definitions.put("/login", "anon");
        definitions.put("/**", "authc");
        bean.setFilterChainDefinitionMap(definitions);

        // 设置manager
        bean.setSecurityManager(securityManager());

        return bean;
    }
}
