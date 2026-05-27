# Stage 1 - Build with JDK
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY backend/first-spring .
RUN ./mvnw clean package -DskipTests

# Stage 2 - Run with JRE
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/first-spring-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]