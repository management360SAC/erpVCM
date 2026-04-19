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
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()

            // públicos
            .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .antMatchers("/auth/**", "/ping", "/actuator/**").permitAll()
            .antMatchers(HttpMethod.POST, "/users/reset-password").permitAll()

            .antMatchers("/nps/public/**").permitAll()
            .antMatchers("/leads/public/**").permitAll()
            .antMatchers("/test/nps/**").permitAll()

            // protegidos
            .antMatchers(HttpMethod.GET, "/roles/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.POST, "/roles/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.PUT, "/roles/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.DELETE, "/roles/**").hasRole("ADMIN")

            .antMatchers(HttpMethod.GET, "/users/**").authenticated()
            .antMatchers(HttpMethod.PUT, "/users/**").hasRole("ADMIN")

            .antMatchers(HttpMethod.GET, "/services/**").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.POST, "/services/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.PUT, "/services/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.DELETE, "/services/**").hasRole("ADMIN")

            .antMatchers(HttpMethod.GET, "/clients/*/services/**").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.POST, "/clients/*/services/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.PUT, "/clients/*/services/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.DELETE, "/clients/*/services/**").hasRole("ADMIN")

            .antMatchers(HttpMethod.GET, "/ops/service-tracking/**").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.POST, "/ops/service-tracking/**").hasAnyRole("ADMIN", "USER")

            .antMatchers(HttpMethod.GET, "/ops/nps/**").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.POST, "/ops/nps/**").hasAnyRole("ADMIN", "USER")

            .antMatchers(HttpMethod.GET, "/leads/stats").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.GET, "/leads/**").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.POST, "/leads/**").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.PUT, "/leads/**").hasAnyRole("ADMIN", "USER")
            .antMatchers(HttpMethod.DELETE, "/leads/**").hasRole("ADMIN")

            .antMatchers("/contracted-services/**").hasAnyRole("ADMIN", "USER")
            .antMatchers("/billing/**").hasAnyRole("ADMIN", "USER")
            .antMatchers("/alerts-reminders/**").authenticated()

            .antMatchers(HttpMethod.GET, "/dashboard/**").authenticated()
            .antMatchers(HttpMethod.GET, "/proyecciones/**").authenticated()
            .antMatchers(HttpMethod.POST, "/proyecciones/**").hasAnyRole("ADMIN", "MANAGER")
            .antMatchers(HttpMethod.DELETE, "/proyecciones/**").hasAnyRole("ADMIN", "MANAGER")

            .antMatchers("/marketing/**").hasAnyRole("ADMIN", "USER", "MANAGER")
            .antMatchers("/analytics/**").hasAnyRole("ADMIN", "USER", "MANAGER", "OPERADOR")

            .antMatchers(HttpMethod.GET, "/reportes/auditoria/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.GET, "/reportes/**").hasAnyRole("ADMIN", "USER", "MANAGER", "OPERADOR")

            .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(Arrays.asList(
            "http://95.216.168.66:5173",
            "http://95.216.168.66"
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