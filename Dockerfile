FROM openjdk:17.0.18
WORKDIR /app
COPY backend/first-spring/target/first-spring-0.0.1-SNAPSHOT.jar /app/first-spring-0.0.1-SNAPSHOT.jar
ENTRYPOINT ["java", "-jar", "first-spring-0.0.1-SNAPSHOT.jar"]