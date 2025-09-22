# Etapa 1: build (Java 8 / Spring Boot 2.2.x)
FROM maven:3.8-jdk-8 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src /app/src
RUN mvn -q clean package -DskipTests

# Etapa 2: Tomcat 9 / JDK8
FROM tomcat:9-jdk8
ENV CATALINA_HOME=/usr/local/tomcat
RUN rm -rf $CATALINA_HOME/webapps/*
# Empaquetamos como ROOT.war para desplegar en /
COPY --from=builder /app/target/ROOT.war $CATALINA_HOME/webapps/ROOT.war
EXPOSE 8080
CMD ["catalina.sh","run"]
