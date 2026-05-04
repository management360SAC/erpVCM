package com.vcm.crm.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final UserDetailsService userDetailsService;
    private final JwtFilter jwtFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder());
    }

    @Override
    public void configure(WebSecurity web) {
        web.ignoring()
            .antMatchers(
                "/favicon.ico",
                "/css/**",
                "/js/**",
                "/images/**",
                "/webjars/**",
                "/error"
            );
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .cors().and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()

                // públicos
                .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/ping").permitAll()
                .antMatchers("/actuator/health").permitAll()
                .antMatchers(HttpMethod.POST, "/api/users/reset-password").permitAll()
                // nps / leads públicos (formularios externos)
                .antMatchers("/api/nps/public/**").permitAll()
                .antMatchers("/api/leads/public/**").permitAll()
                // bcrypt y test: solo ADMIN
                .antMatchers("/bcrypt/**").hasRole("ADMIN")
                .antMatchers("/api/test/**").hasRole("ADMIN")

                // roles
                .antMatchers(HttpMethod.GET, "/api/roles/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.POST, "/api/roles/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.PUT, "/api/roles/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.DELETE, "/api/roles/**").hasRole("ADMIN")

                // users
                .antMatchers(HttpMethod.GET, "/api/users/**").authenticated()
                .antMatchers(HttpMethod.PUT, "/api/users/**").hasRole("ADMIN")

                // services
                .antMatchers(HttpMethod.GET, "/api/services/**").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.POST, "/api/services/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.PUT, "/api/services/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.DELETE, "/api/services/**").hasRole("ADMIN")

                // client services
                .antMatchers(HttpMethod.GET, "/api/clients/*/services/**").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.POST, "/api/clients/*/services/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.PUT, "/api/clients/*/services/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.DELETE, "/api/clients/*/services/**").hasRole("ADMIN")

                // ops
                .antMatchers(HttpMethod.GET, "/api/ops/service-tracking/**").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.POST, "/api/ops/service-tracking/**").hasAnyRole("ADMIN", "USER")

                .antMatchers(HttpMethod.GET, "/api/ops/nps/**").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.POST, "/api/ops/nps/**").hasAnyRole("ADMIN", "USER")

                // leads
                .antMatchers(HttpMethod.GET, "/api/leads/stats").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.GET, "/api/leads/**").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.POST, "/api/leads/**").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.PUT, "/api/leads/**").hasAnyRole("ADMIN", "USER")
                .antMatchers(HttpMethod.DELETE, "/api/leads/**").hasRole("ADMIN")

                // otros módulos
                .antMatchers("/api/contracted-services/**").hasAnyRole("ADMIN", "USER")
                .antMatchers("/api/billing/**").hasAnyRole("ADMIN", "USER")
                .antMatchers("/api/alerts-reminders/**").authenticated()

                // dashboard & proyecciones
                .antMatchers(HttpMethod.GET, "/api/dashboard/**").authenticated()
                .antMatchers(HttpMethod.GET, "/api/proyecciones/**").authenticated()
                .antMatchers(HttpMethod.POST, "/api/proyecciones/**").hasAnyRole("ADMIN", "MANAGER")
                .antMatchers(HttpMethod.DELETE, "/api/proyecciones/**").hasAnyRole("ADMIN", "MANAGER")

                // marketing
                .antMatchers("/api/marketing/**").hasAnyRole("ADMIN", "USER", "MANAGER")

                // analytics
                .antMatchers("/api/analytics/**").hasAnyRole("ADMIN", "USER", "MANAGER", "OPERADOR")

                // reportes
                .antMatchers(HttpMethod.GET, "/api/reportes/auditoria/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.GET, "/api/reportes/**").hasAnyRole("ADMIN", "USER", "MANAGER", "OPERADOR")
                
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(Arrays.asList(
            "http://95.216.168.66:5173",
            "http://95.216.168.66",
            "http://localhost:5173",
            "http://localhost:3000"
        ));

        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"
        ));

        config.setExposedHeaders(Arrays.asList(
            "Authorization", "Content-Type"
        ));

        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}