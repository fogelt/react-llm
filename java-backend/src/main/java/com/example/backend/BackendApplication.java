package com.example.backend;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.annotations.QuarkusMain;

@QuarkusMain
public class BackendApplication {

  public static void main(String... args) {
    Quarkus.run(args);
  }
}