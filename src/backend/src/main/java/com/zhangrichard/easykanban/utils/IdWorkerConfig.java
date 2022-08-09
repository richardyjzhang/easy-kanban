package com.zhangrichard.easykanban.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class IdWorkerConfig {

    @Value("${application.dataCenterId}")
    private Long dataCenterId;

    @Value("${application.machineId}")
    private Long machineId;

    @Bean
    public IdWorker idWorker() {
        return new IdWorker(dataCenterId, machineId);
    }
}
