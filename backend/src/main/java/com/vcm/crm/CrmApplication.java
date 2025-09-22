package com.vcm.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication  // escanea com.vcm.crm y subpaquetes (controller, service, etc.)
public class CrmApplication extends SpringBootServletInitializer {

  @Override
  protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
    return builder.sources(CrmApplication.class);
  }

  public static void main(String[] args) {
    SpringApplication.run(CrmApplication.class, args);
  }
}
