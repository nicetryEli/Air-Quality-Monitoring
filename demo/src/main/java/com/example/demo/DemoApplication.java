package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {"com.aqi.warning", "com.example.demo"})
@EntityScan(basePackages = {"com.aqi.warning.entity", "com.example.demo.entity"})
@EnableJpaRepositories(basePackages = {"com.aqi.warning.repository", "com.example.demo.repository"})
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
