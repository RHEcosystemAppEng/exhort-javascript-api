package org.zgrinber.tracing.common.service;

import org.zgrinber.tracing.common.dto.CarDto;
import org.zgrinber.tracing.common.exceptions.RestApiException;

import java.util.List;

public interface CarService {

    CarDto getOneCar(String carId) throws RestApiException;
    List<CarDto> getAllCars() throws RestApiException;
    void createCar(CarDto car) throws RestApiException;
    void updateCar(CarDto car) throws RestApiException;

    void deleteCar(String carId) throws RestApiException;



}
