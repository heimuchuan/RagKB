# ---- 构建阶段 ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
# 先复制 pom 拉取依赖，利用 Docker 层缓存
COPY pom.xml .
RUN mvn -B dependency:go-offline
# 复制源码并打包
COPY src ./src
RUN mvn -B -DskipTests package

# ---- 运行阶段 ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]