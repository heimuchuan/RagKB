package com.campus.knowledge;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 校园协作知识库系统启动类
 */
@SpringBootApplication
@MapperScan("com.campus.knowledge.mapper")
public class CampusKnowledgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusKnowledgeApplication.class, args);
    }
}