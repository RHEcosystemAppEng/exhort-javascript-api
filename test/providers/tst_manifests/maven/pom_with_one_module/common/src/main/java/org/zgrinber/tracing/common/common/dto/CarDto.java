package org.zgrinber.tracing.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Objects;


public class CarDto
{
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String id;
    private String manufacturer;
    private String country;
    private String model;
    private Integer year;
    private String color;
    private Integer price;
    private String currency;


    public static CarDto getNewCarDtoInstance()
    {
        return new CarDto();
    }

    private CarDto()
    {

    }
    public CarDto(String id,String manufacturer, String country, String model, Integer year, String color, Integer price, String currency) {
        this.manufacturer = manufacturer;
        this.country = country;
        this.model = model;
        this.year = year;
        this.color = color;
        this.price = price;
        this.currency = currency;
        this.id = id;

    }

    public boolean equals(Object object) {
        if (this == object) return true;
        if (object == null || getClass() != object.getClass()) return false;
        if (!super.equals(object)) return false;
        CarDto carDto = (CarDto) object;
        return java.util.Objects.equals(id, carDto.id) && java.util.Objects.equals(manufacturer, carDto.manufacturer) && java.util.Objects.equals(country, carDto.country) && java.util.Objects.equals(model, carDto.model) && java.util.Objects.equals(year, carDto.year) && java.util.Objects.equals(color, carDto.color) && java.util.Objects.equals(price, carDto.price) && java.util.Objects.equals(currency, carDto.currency);
    }

    public int hashCode() {
        return Objects.hash(super.hashCode(), id,  manufacturer, country, model, year, color, price, currency);
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @java.lang.Override
    public java.lang.String toString() {
        return "CarDto{" +
                "id='" + id + '\'' +
                ", manufacturer='" + manufacturer + '\'' +
                ", country='" + country + '\'' +
                ", model='" + model + '\'' +
                ", year=" + year +
                ", color='" + color + '\'' +
                ", price=" + price +
                ", currency='" + currency + '\'' +
                '}';
    }

}
