plugins {
    id("java")
}

version = "1.0.0-SNAPSHOT"
group = "org.acme.dbaas"

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.quarkus:quarkus-hibernate-orm:2.13.5.Final")
    implementation("io.quarkus:quarkus-agroal:2.13.5.Final")
    implementation("io.quarkus:quarkus-resteasy:2.13.5.Final")
    implementation("io.quarkus:quarkus-resteasy-jackson:2.13.5.Final")
    implementation("io.quarkus:quarkus-jdbc-postgresql:2.13.5.Final")
    implementation("io.quarkus:quarkus-vertx-http:2.13.5.Final")
    implementation("io.quarkus:quarkus-kubernetes-service-binding:2.13.5.Final")
    implementation("io.quarkus:quarkus-container-image-docker:2.13.5.Final")
    implementation("jakarta.validation:jakarta.validation-api:2.0.2")
    implementation("io.quarkus:quarkus-resteasy-multipart:2.13.7.Final")
    implementation("io.quarkus:quarkus-hibernate-orm-deployment:2.0.2.Final")
    implementation("log4j:log4j:1.2.17")  // exhortignore
}

test {
    useJUnitPlatform()
}
