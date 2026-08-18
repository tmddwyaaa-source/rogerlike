package com.rogerlike;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.rogerlike.mapper")
public class RogerlikeApplication {
    public static void main(String[] args) {
        SpringApplication.run(RogerlikeApplication.class, args);
    }
}
