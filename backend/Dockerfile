# Etapa 1: build (Java 8 / Spring Boot 2.2.x)
FROM maven:3.8-jdk-8 AS builder
WORKDIR /app

# Opcional: timeouts/red más tolerantes
ENV MAVEN_OPTS="-Dorg.apache.maven.wagon.httpconnectionManager.ttl=30 \
 -Dorg.apache.maven.wagon.http.pool=false \
 -Dorg.apache.maven.wagon.http.retryHandler.count=3"

# 1) Copiamos POM primero para cachear dependencias
COPY pom.xml .

# 2) Resolver dependencias con actualización forzada; si falla, limpiar y reintentar
RUN mvn -q -U -DskipTests dependency:go-offline \
 || (rm -rf /root/.m2/repository && mvn -q -U -DskipTests dependency:go-offline)

# 3) Copiamos el código
COPY src /app/src

# 4) Compilamos el WAR
RUN mvn -q -U clean package -DskipTests

# Etapa 2: Tomcat 9 / JDK8
FROM tomcat:9-jdk8
ENV CATALINA_HOME=/usr/local/tomcat
RUN rm -rf $CATALINA_HOME/webapps/*

# Asegúrate que en el POM tengas <packaging>war</packaging> y <finalName>ROOT</finalName>
COPY --from=builder /app/target/ROOT.war $CATALINA_HOME/webapps/ROOT.war

EXPOSE 8080
CMD ["catalina.sh","run"]
