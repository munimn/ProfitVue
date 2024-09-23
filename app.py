from sklearn.metrics import mean_squared_error
from math import sqrt
from prophet.plot import plot_cross_validation_metric
from prophet.diagnostics import cross_validation, performance_metrics
from flask import jsonify
from sklearn.metrics import mean_absolute_percentage_error
from prophet import Prophet
from pmdarima import auto_arima
from statsmodels.tsa.statespace.sarimax import SARIMAX
from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS
from flask_cors import cross_origin
from prophet import Prophet
import pmdarima as pm
from pmdarima.arima import auto_arima
import pandas as pd
import numpy as np
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, create_refresh_token
from flask_jwt_extended import jwt_required


app = Flask(__name__)

# Initialize the CORS extension and pass your Flask app to it
cors = CORS(app, resources={r"/*": {"origins": "*"}})
# MySQL database configuration
# MySQL database configuration
db = None  # Initialize the database connection outside of the app context
cursor = None  # Initialize the cursor outside of the app context
# Replace with a secure secret key
app.config['JWT_SECRET_KEY'] = 'Sergel20mg$$'
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


def initialize_database():
    global db, cursor
    try:
        db = mysql.connector .connect(
            host="127.0.0.1",
            user="root",
            password="Sergel20mg$$",
            database="Sales"
        )
        cursor = db.cursor()
        return db
    except mysql.connector.Error as e:
        # Handle the error (e.g., print an error message)
        print(f"Error connecting to the database: {e}")
        db = None


@app.before_request
def before_request():
    initialize_database()  # Open the database connection before each request


# @app.teardown_request
# def teardown_request(exception=None):
#     if db:
#         db.close()  # Close the database connection


@app.route('/login', methods=['POST'])
@cross_origin()
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']

    # Check if the user exists in the database
    select_query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(select_query, (username,))
    user = cursor.fetchone()

    if user and bcrypt.check_password_hash(user[2], password):
        # If the user exists and the password is correct, create access and refresh tokens
        access_token = create_access_token(identity=username)

        # Include the iduser in the response_data
        response_data = {
            'access_token': access_token,
            # Replace 0 with the actual index of iduser in your user tuple
            'iduser': user[0]
        }
        return jsonify(response_data), 200
    else:
        # If the user does not exist or the password is incorrect, return an error message
        response_data = {'message': 'Login failed. Invalid credentials'}
        return jsonify(response_data), 401


@app.route('/register', methods=['POST'])
@cross_origin()
def register():
    data = request.get_json()
    username = data['username']
    password = data['password']

    # Check if the username already exists in the database
    select_query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(select_query, (username,))
    existing_user = cursor.fetchone()

    if existing_user:
        response_data = {
            'message': 'Registration failed. Username already exists.'}
        # HTTP 409 Conflict status code for username conflict
        return jsonify(response_data), 409
    else:
        # Hash the user's password before storing it in the database
        hashed_password = bcrypt.generate_password_hash(
            password).decode('utf-8')

        # Insert the new user into the database
        insert_query = "INSERT INTO users (username, password) VALUES (%s, %s)"
        cursor.execute(insert_query, (username, hashed_password))
        db.commit()

        response_data = {
            'message': 'Registration successful. New user created.'}
        # HTTP 201 Created status code for successful registration
        return jsonify(response_data), 201


@app.route('/add_entry/<int:user>', methods=['POST'])
@cross_origin()
@jwt_required()
def add_entry(user):
    data = request.get_json()
    date = data['date']
    product_id = data['product_id']
    amount = data['amount']
    user = data['user']

    # Check if a row with the same values already exists
    select_query = "SELECT * FROM productsales WHERE date = %s AND product_id = %s AND amount = %s AND user = %s"
    cursor.execute(select_query, (date, product_id, amount, user))

    # Consume the result set
    existing_entry = cursor.fetchone()

    if existing_entry:
        # If a duplicate entry exists, return a message indicating it's a duplicate
        response_data = {'message': 'Duplicate entry. Entry not added.'}
        return jsonify(response_data), 409
    else:
        # Insert the data into the MySQL database
        insert_query = "INSERT INTO productsales (product_id, date, amount,user) VALUES (%s, %s, %s,%s)"
        cursor.execute(insert_query, (product_id, date, amount, user))
        db.commit()
        response_data = {'message': 'Entry added successfully'}

    # Return a JSON response
    return jsonify(response_data)


@app.route('/get_entries/<int:user>', methods=['GET'])
# Allow requests from any origin
@cross_origin()
@jwt_required()
def get_entries(user):
    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()
    # Retrieve all entries from the MySQL database
    try:
        select_query = "SELECT * FROM productsales WHERE user= %s ORDER BY date;"
        cursor.execute(select_query, (user,))
        entries = cursor.fetchall()
        cursor.close()
        db.close()

        # Convert the entries to a list of dictionaries
        entry_list = []
        for entry in entries:
            entry_dict = {
                'id': entry[0],
                'product_id': entry[1],
                'date': entry[2],
                'amount': entry[3]

            }
            entry_list.append(entry_dict)

        # Return the list of entries as JSON
        return jsonify(entry_list)
    except Exception as e:
        return jsonify({'message': f'Error retrieving entries: {str(e)}'}), 500
    finally:
        cursor.close()


@app.route('/get_forecasts/<int:user>', methods=['GET'])
@cross_origin()
@jwt_required()
def get_forecasts(user):
    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()
    # Retrieve all entries from the MySQL database
    try:
        select_query = "SELECT * FROM forecasts WHERE user = %s"
        cursor.execute(select_query, (user,))
        entries = cursor.fetchall()

        # Convert the entries to a list of dictionaries
        entry_list = []
        for entry in entries:
            entry_dict = {
                'date': entry[0],
                'forecast': entry[1]
            }
            entry_list.append(entry_dict)

        # Return the list of entries as JSON
        return jsonify(entry_list)
    except Exception as e:
        return jsonify({'message': f'Error retrieving entries: {str(e)}'}), 500
    finally:
        cursor.close()


@app.route('/generate_forecasts/<int:user>', methods=['POST'])
@cross_origin()
@jwt_required()
def perform_forecast(user):
    try:
        # Retrieve historical sales data
        select_query = "SELECT date, amount FROM productsales WHERE user = %s"
        cursor.execute(select_query, (user,))
        sales_data = cursor.fetchall()
        df = pd.DataFrame(sales_data, columns=['ds', 'y'])
        # Convert 'ds' column to datetime
        df['ds'] = pd.to_datetime(df['ds'])
        print(df)

        # Set 'ds' as the index of the DataFrame
        df = df.set_index('ds')
        print(df)
        # Resample and aggregate by day
        df = df.resample('D').sum()
        print(df)
        # Reset the index if you want 'ds' back as a column
        df = df.reset_index("ds")

        # Divide data into train and test sets
        train = df[:-120]  # leaving 4 data points for testing
        test = df[-120:]

        # Define functions for the models

        def fit_prophet(df, country_holidays='US'):
            # Define the model with hyperparameters you wish to tune
            prophet_model = Prophet(
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10,
                holidays_prior_scale=10,
                seasonality_mode='additive',
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False
            )

            # Add country-specific holidays
            prophet_model.add_country_holidays(country_name=country_holidays)

            # Fit the model
            prophet_model.fit(df)

            return prophet_model

        def fit_auto_arima(df):
            # Fit an auto ARIMA model to the data
            model = auto_arima(df['y'], seasonal=True, stepwise=True)
            best_model = pm.ARIMA(
                order=model.order, seasonal_order=model.seasonal_order)
            result = best_model.fit(df['y'])
            return result

        # Fit models
        prophet_model = fit_prophet(train)
        auto_arima_model = fit_auto_arima(train)

        # Forecast with Prophet
        future = prophet_model.make_future_dataframe(periods=120)
        prophet_forecast = prophet_model.predict(future)

        # Forecast with auto ARIMA
        auto_arima_forecast = auto_arima_model.predict(
            n_periods=120, return_conf_int=False)
        print(auto_arima_forecast)

        def calculate_rmse(actual, forecast):
            mse = mean_squared_error(actual, forecast)
            rmse = sqrt(mse)
            return rmse

        prophet_rmse = calculate_rmse(
            test['y'], prophet_forecast['yhat'][-120:])
        auto_arima_rmse = calculate_rmse(
            test['y'], auto_arima_forecast)
        print(auto_arima_rmse)
        print(prophet_rmse)

        # Select the best model based on RMSE
        best_model, forecast = (prophet_model, prophet_forecast) if prophet_rmse < auto_arima_rmse else (
            auto_arima_model, auto_arima_forecast)
        # Save forecast to database
        delete_query = "DELETE FROM forecasts WHERE user = %s"
        cursor.execute(delete_query, (user,))
        db.commit()

        for i in range(120):
            date = df['ds'].iloc[-1] + pd.DateOffset(days=i+1)
            forecast_value = forecast.values[i] if isinstance(
                forecast, pd.Series) else forecast['yhat'].iloc[-1-i]
            insert_query = "INSERT INTO forecasts (date, forecast,user) VALUES (%s, %s,%s)"
            cursor.execute(insert_query, (date, forecast_value, user))
            db.commit()

        return jsonify({'message': 'Forecasts generated and saved successfully'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error generating and saving forecasts'}), 500


# @app.route('/generate_forecasts2/<int:user>', methods=['POST'])
# @cross_origin()
# @jwt_required()
# def perform_forecast2(user):
#     try:
#         # Retrieve historical sales data from the "Product_Sales" table
#         select_query = "SELECT date, amount FROM Product_Sales WHERE user = %s"
#         cursor.execute(select_query, (user,))
#         sales_data = cursor.fetchall()

#         # Create a DataFrame from the sales data
#         import pandas as pd
#         df = pd.DataFrame(sales_data, columns=['ds', 'y'])

#         # Fit an auto ARIMA model to the data
#         model = auto_arima(df['y'], seasonal=True, stepwise=True)
#         best_model = pm.ARIMA(
#             order=model.order, seasonal_order=model.seasonal_order)
#         result = best_model.fit(df['y'])
#         print(result.aic())

#         # Forecast the next 'horizon' periods
#         horizon = 4
#         forecast = best_model.predict(
#             n_periods=horizon, return_conf_int=False)

#         # Delete all rows from the "forecasts" table
#         delete_query = "DELETE FROM forecasts WHERE user = %s"
#         cursor.execute(delete_query, (user,))
#         db.commit()
#         print(forecast)

#         # Store the forecasts in the "forecasts" table in the database
#         for i in range(horizon):
#             date = df['ds'].iloc[-1] + pd.DateOffset(days=i+1)
#             forecast_value = forecast.values[i]
#             insert_query = "INSERT INTO forecasts (date, forecast,user) VALUES (%s, %s,%s)"
#             try:
#                 cursor.execute(insert_query, (date, forecast_value, user))
#                 db.commit()
#             except Exception as db_error:
#                 db.rollback()

#         response_data = {
#             'message': 'Forecasts generated and saved successfully'
#         }
#         return jsonify(response_data)

#     except Exception as e:
#         # Handle any exceptions (e.g., database errors)
#         print(f"Error: {str(e)}")
#         return jsonify({'message': 'Error generating and saving forecasts'}), 500


@app.route('/delete_entry/<int:entry_id>', methods=['DELETE'])
@cross_origin()
@jwt_required()
def delete_entry(entry_id):
    try:
        # Check if the entry with the specified ID exists
        select_query = "SELECT * FROM productsales WHERE id = %s"
        cursor.execute(select_query, (entry_id,))
        existing_entry = cursor.fetchone()

        if existing_entry:
            # If the entry exists, delete it from the database
            delete_query = "DELETE FROM productsales WHERE id = %s"
            cursor.execute(delete_query, (entry_id,))
            db.commit()
            response_data = {
                'message': f'Entry with ID {entry_id} deleted successfully'}
            return jsonify(response_data)
        else:
            # If the entry does not exist, return a 404 status code
            return jsonify({'message': f'Entry with ID {entry_id} not found'}), 404
    except Exception as e:
        # Handle any exceptions (e.g., database errors)
        return jsonify({'message': 'Error deleting entry'}), 500


@app.route('/get_unit_price_entries/<int:user>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_unit_price_entries(user):
    # Retrieve all entries from the "Unit_Price" table
    select_query = "SELECT * FROM unitprice WHERE user = %s"
    cursor.execute(select_query, (user,))
    entries = cursor.fetchall()

    # Convert the entries to a list of dictionaries
    entry_list = []
    for entry in entries:
        entry_dict = {
            'Product_ID': entry[1],
            'Price': entry[2],
            'Vendor': entry[3]
        }
        entry_list.append(entry_dict)

    return jsonify(entry_list)


@app.route('/add_price_entry/<int:user>', methods=['POST'])
@jwt_required()
@cross_origin()
def add_price_entry(user):
    data = request.get_json()
    Product_ID = data['Product_ID']
    Price = data['Price']
    Vendor = data['Vendor']
    user = data['user']

    # Check if a row with the same values already exists
    select_query = "SELECT * FROM unitprice WHERE Product_ID = %s AND Price = %s AND Vendor = %s AND user = %s"
    cursor.execute(select_query, (Product_ID, Price, Vendor, user))

    # Consume the result set
    existing_entry = cursor.fetchone()

    if existing_entry:
        # If a duplicate entry exists, return a message indicating it's a duplicate
        response_data = {'message': 'Duplicate entry. Entry not added.'}
        return jsonify(response_data), 409
    else:
        # Insert the data into the MySQL database
        insert_query = "INSERT INTO unitprice (Product_ID, Price, Vendor,user) VALUES (%s, %s, %s,%s)"
        cursor.execute(insert_query, (Product_ID, Price, Vendor, user))
        db.commit()
        response_data = {'message': 'Entry added successfully'}

    # Return a JSON response
    return jsonify(response_data)


@app.route('/update_unit_price/<int:product_id>', methods=['PUT'])
@jwt_required()
@cross_origin()
def update_unit_price(product_id):
    data = request.get_json()
    price = data['Price']
    vendor = data['Vendor']

    # Check if the product with the specified product_id exists
    select_query = "SELECT * FROM unitprice WHERE Product_ID = %s"
    cursor.execute(select_query, (product_id,))
    existing_entry = cursor.fetchone()

    if existing_entry:
        # If the product exists, update its price and vendor
        update_query = "UPDATE unitprice SET Price = %s, Vendor = %s WHERE Product_ID = %s"
        cursor.execute(update_query, (price, vendor, product_id))
        db.commit()
        response_data = {
            'message': f'Price and vendor for Product_ID {product_id} updated successfully'
        }
        return jsonify(response_data)
    else:
        # If the product does not exist, return a 404 status code
        return jsonify({'message': f'Product with Product_ID {product_id} not found'}), 404


@app.route('/get_costs/<int:user>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_costs(user):
    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()

    # Retrieve all entries from the "Unit_Price" table
    try:
        select_query = "SELECT * FROM ap WHERE user = %s ORDER BY date;"
        cursor.execute(select_query, (user,))
        entries = cursor.fetchall()

        # Convert the entries to a list of dictionaries
        entry_list = []
        for entry in entries:
            entry_dict = {
                'idap': entry[0],
                'date': entry[1],
                'Description': entry[2],
                'usdamount': entry[3],
                'vendor': entry[4],
                'user': entry[5],
                'unitprice': entry[6],
                'amount': entry[7]
            }
            entry_list.append(entry_dict)

        return jsonify(entry_list)
    except Exception as e:
        return jsonify({'message': f'Error retrieving entries: {str(e)}'}), 500
    finally:
        cursor.close()


@app.route('/add_costs/<int:user>', methods=['POST'])
@jwt_required()
@cross_origin()
def add_costs(user):
    data = request.get_json()
    Date = data['date']
    Description = data['Description']
    usdamount = data["usdamount"]
    vendor = data["vendor"]
    user = data['user']
    unitprice = data["unitprice"]
    amount = data['amount']

    # Check if a row with the same values already exists
    select_query = "SELECT * FROM ap WHERE amount = %s AND usdamount = %s AND vendor = %s AND user = %s AND date = %s"
    cursor.execute(select_query, (amount, usdamount, vendor, user, Date))

    # Consume the result set
    existing_entry = cursor.fetchone()

    if existing_entry:
        # If a duplicate entry exists, return a message indicating it's a duplicate
        response_data = {'message': 'Duplicate entry. Entry not added.'}
        return jsonify(response_data), 409
    else:
        # Insert the data into the MySQL database
        insert_query = "INSERT INTO ap (date,description,usdamount, vendor,user,unitprice,amount) VALUES (%s, %s, %s,%s,%s, %s, %s)"
        cursor.execute(insert_query, (Date, Description,
                       usdamount, vendor, user, unitprice, amount))
        db.commit()
        response_data = {'message': 'Entry added successfully'}

    # Return a JSON response
    return jsonify(response_data)


@app.route('/update_costs/<int:idap>', methods=['PUT'])
@jwt_required()
@cross_origin()
def update_costs(idap):
    data = request.get_json()
    Date = data['date']
    Description = data['Description']
    usdamount = data["usdamount"]
    vendor = data["vendor"]
    unitprice = data["unitprice"]
    amount = data['amount']

    # Check if the product with the specified product_id exists
    # Check if a row with the same values already exists
    select_query = "SELECT * FROM ap WHERE idap = %s"
    cursor.execute(select_query, (idap,))
    existing_entry = cursor.fetchone()

    if existing_entry:
        # If the product exists, update its price and vendor
        update_query = "UPDATE ap SET date = %s , Description = %s , usdamount = %s, vendor = %s ,unitprice = %s ,amount = %s WHERE idap = %s "
        cursor.execute(update_query, (Date, Description,
                       usdamount, vendor, unitprice, amount, idap))
        db.commit()
        response_data = {
            'message': f'Ap transactiion {idap} updated successfully'
        }
        return jsonify(response_data)
    else:
        # If the product does not exist, return a 404 status code
        return jsonify({'Ap transactiion {idap} not found'}), 404


@app.route('/get_total_sales/<int:user>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_all_entries(user):
    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()
    try:
        # Retrieve all entries from the view
        select_query = "SELECT * FROM dailytotalsales WHERE user= %s"
        cursor.execute(select_query, (user,))
        entries = cursor.fetchall()

        # Convert the entries to a list of dictionaries
        entry_list = []
        for entry in entries:
            entry_dict = {
                'date': entry[0],
                'product_id': entry[1],
                'total_sales': entry[2]
            }
            entry_list.append(entry_dict)

        # Return the list of entries as JSON
        return jsonify(entry_list)
    except Exception as e:
        return jsonify({'message': f'Error retrieving entries: {str(e)}'}), 500
    finally:
        cursor.close()


@app.route('/get_ar_forecasts/<int:user>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_ar(user):
    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()
    try:
        # Retrieve all entries from the view
        select_query = "SELECT * FROM ar WHERE user= %s"
        cursor.execute(select_query, (user,))
        entries = cursor.fetchall()

        # Convert the entries to a list of dictionaries
        entry_list = []
        for entry in entries:
            entry_dict = {
                'date': entry[0],
                'forecast': entry[1],
            }
            entry_list.append(entry_dict)

        # Return the list of entries as JSON
        return jsonify(entry_list)
    except Exception as e:
        return jsonify({'message': f'Error retrieving entries: {str(e)}'}), 500
    finally:
        cursor.close()


@app.route('/generate_forecasts_totalsales/<int:user>', methods=['POST'])
@cross_origin()
@jwt_required()
def perform_arforecast(user):
    try:
        # Retrieve historical sales data
        select_query = "SELECT date,total_sales FROM dailytotalsales WHERE user= %s"
        cursor.execute(select_query, (user,))
        sales_data = cursor.fetchall()
        df = pd.DataFrame(sales_data, columns=['ds', 'y'])
        # Convert 'ds' column to datetime
        df['ds'] = pd.to_datetime(df['ds'])
        print(df)

        # Set 'ds' as the index of the DataFrame
        df = df.set_index('ds')
        print(df)
        # Resample and aggregate by day
        df = df.resample('D').sum()
        print(df)
        # Reset the index if you want 'ds' back as a column
        df = df.reset_index("ds")

        # Divide data into train and test sets
        train = df[:-120]  # leaving 30 data points for testing
        test = df[-120:]

        # Define functions for the models

        def fit_prophet(df, country_holidays='US'):
            # Define the model with hyperparameters you wish to tune
            prophet_model = Prophet(
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10,
                holidays_prior_scale=10,
                seasonality_mode='additive',
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False
            )

            # Add country-specific holidays
            prophet_model.add_country_holidays(country_name=country_holidays)

            # Fit the model
            prophet_model.fit(df)

            return prophet_model

        def fit_auto_arima(df):
            # Fit an auto ARIMA model to the data
            model = auto_arima(df['y'], seasonal=True, stepwise=True)
            best_model = pm.ARIMA(
                order=model.order, seasonal_order=model.seasonal_order)
            result = best_model.fit(df['y'])
            return result

        # Fit models
        prophet_model = fit_prophet(train)
        auto_arima_model = fit_auto_arima(train)

        # Forecast with Prophet
        future = prophet_model.make_future_dataframe(periods=120)
        prophet_forecast = prophet_model.predict(future)

        # Forecast with auto ARIMA
        auto_arima_forecast = auto_arima_model.predict(
            n_periods=120, return_conf_int=False)
        print(auto_arima_forecast)

        def calculate_rmse(actual, forecast):
            mse = mean_squared_error(actual, forecast)
            rmse = sqrt(mse)
            return rmse

        prophet_rmse = calculate_rmse(
            test['y'], prophet_forecast['yhat'][-120:])
        auto_arima_rmse = calculate_rmse(
            test['y'], auto_arima_forecast)
        print(auto_arima_rmse)
        print(prophet_rmse)

        # Select the best model based on RMSE
        best_model, forecast = (prophet_model, prophet_forecast) if prophet_rmse < auto_arima_rmse else (
            auto_arima_model, auto_arima_forecast)
        # Save forecast to database
        delete_query = "DELETE FROM ar WHERE user = %s"
        cursor.execute(delete_query, (user,))
        db.commit()

        for i in range(120):
            date = df['ds'].iloc[-1] + pd.DateOffset(days=i+1)
            forecast_value = forecast.values[i] if isinstance(
                forecast, pd.Series) else forecast['yhat'].iloc[-1-i]
            insert_query = "INSERT INTO ar (date, forecast,user) VALUES (%s, %s,%s)"
            cursor.execute(insert_query, (date, forecast_value, user))
            db.commit()

        return jsonify({'message': 'Forecasts generated and saved successfully'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error generating and saving forecasts'}), 500


@app.route('/get_ap_forecasts/<int:user>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_ap_forecast(user):
    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()
    try:
        # Retrieve all entries from the view
        select_query = "SELECT * FROM ap_forecast WHERE user= %s"
        cursor.execute(select_query, (user,))
        entries = cursor.fetchall()

        # Convert the entries to a list of dictionaries
        entry_list = []
        for entry in entries:
            entry_dict = {
                'date': entry[0],
                'forecast': entry[1],
            }
            entry_list.append(entry_dict)

        # Return the list of entries as JSON
        return jsonify(entry_list)
    except Exception as e:
        return jsonify({'message': f'Error retrieving entries: {str(e)}'}), 500
    finally:
        cursor.close()


@app.route('/generate_forecasts_ap/<int:user>', methods=['POST'])
@cross_origin()
@jwt_required()
def perform_apforecast(user):
    try:
        # Retrieve historical sales data
        select_query = "SELECT date,usdamount FROM ap WHERE user= %s"
        cursor.execute(select_query, (user,))
        sales_data = cursor.fetchall()
        df = pd.DataFrame(sales_data, columns=['ds', 'y'])
        # Convert 'ds' column to datetime
        df['ds'] = pd.to_datetime(df['ds'])
        print(df)

        # Set 'ds' as the index of the DataFrame
        df = df.set_index('ds')
        print(df)
        # Resample and aggregate by day
        df = df.resample('D').sum()
        print(df)
        # Reset the index if you want 'ds' back as a column
        df = df.reset_index("ds")

        # Divide data into train and test sets
        train = df[:-120]  # leaving 30 data points for testing
        test = df[-120:]

        # Define functions for the models

        def fit_prophet(df, country_holidays='US'):
            # Define the model with hyperparameters you wish to tune
            prophet_model = Prophet(
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10,
                holidays_prior_scale=10,
                seasonality_mode='additive',
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False
            )

            # Add country-specific holidays
            prophet_model.add_country_holidays(country_name=country_holidays)

            # Fit the model
            prophet_model.fit(df)

            return prophet_model

        def fit_auto_arima(df):
            # Fit an auto ARIMA model to the data
            model = auto_arima(df['y'], seasonal=True, stepwise=True)
            best_model = pm.ARIMA(
                order=model.order, seasonal_order=model.seasonal_order)
            result = best_model.fit(df['y'])
            return result

        # Fit models
        prophet_model = fit_prophet(train)
        auto_arima_model = fit_auto_arima(train)

        # Forecast with Prophet
        future = prophet_model.make_future_dataframe(periods=30)
        prophet_forecast = prophet_model.predict(future)

        # Forecast with auto ARIMA
        auto_arima_forecast = auto_arima_model.predict(
            n_periods=120, return_conf_int=False)
        print(auto_arima_forecast)

        def calculate_rmse(actual, forecast):
            mse = mean_squared_error(actual, forecast)
            rmse = sqrt(mse)
            return rmse

        prophet_rmse = calculate_rmse(
            test['y'], prophet_forecast['yhat'][-120:])
        auto_arima_rmse = calculate_rmse(
            test['y'], auto_arima_forecast)
        print(auto_arima_rmse)
        print(prophet_rmse)

        # Select the best model based on RMSE
        best_model, forecast = (prophet_model, prophet_forecast) if prophet_rmse < auto_arima_rmse else (
            auto_arima_model, auto_arima_forecast)
        # Save forecast to database
        delete_query = "DELETE FROM ap_forecast WHERE user = %s"
        cursor.execute(delete_query, (user,))
        db.commit()

        for i in range(120):
            date = df['ds'].iloc[-1] + pd.DateOffset(days=i+1)
            forecast_value = forecast.values[i] if isinstance(
                forecast, pd.Series) else forecast['yhat'].iloc[-1-i]
            insert_query = "INSERT INTO ap_forecast (date, forecast,user) VALUES (%s, %s,%s)"
            cursor.execute(insert_query, (date, forecast_value, user))
            db.commit()

        return jsonify({'message': 'Forecasts generated and saved successfully'})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error generating and saving forecasts'}), 500


@app.route('/get_balancesheet/<int:user>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_balancesheet(user):
    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()

    try:
        select_query = "SELECT * FROM  balancesheet WHERE user = %s"
        cursor.execute(select_query, (user,))
        print(cursor)
        entries = cursor.fetchall()

        entry_list = []
        for entry in entries:
            entry_dict = {
                'totalar': entry[1],
                'totalap': entry[2],
                'profit': entry[3]
            }
        entry_list.append(entry_dict)
        cursor.close()

        return jsonify(entry_list)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'message': f'Error retrieving data: {str(e)}'}), 500
    finally:
        cursor.close()  # Ensure cursor is closed after use


@app.route('/get_balancesheet_forecast/<int:user>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_balancesheet_forecast(user):

    db = initialize_database()  # Ensure you have an active db connection
    cursor = db.cursor()
    # Retrieve all entries from the "Unit_Price" table
    try:
        select_query = "SELECT * FROM  forecastedbalancesheet WHERE user = %s"
        cursor.execute(select_query, (user,))
        print(cursor)
        entries = cursor.fetchall()

        # Convert the entries to a list of dictionaries
        entry_list = []
        for entry in entries:
            entry_dict = {
                'apforecast': entry[1],
                'arforecast': entry[2],
                'profitforecast': entry[3]
            }
            entry_list.append(entry_dict)
        cursor.close()

        return jsonify(entry_list)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'message': f'Error retrieving data: {str(e)}'}), 500
    finally:
        cursor.close()  # Ensure cursor is closed after use


if __name__ == '__main__':
    app.run()
