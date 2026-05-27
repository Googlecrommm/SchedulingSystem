FROM eclipse-temurin:17-jre
WORKDIR /app
COPY backend/first-spring .
RUN ./mvnw clean package -DskipTests
ENTRYPOINT ["java", "-jar", "target/first-spring-0.0.1-SNAPSHOT.jar"]