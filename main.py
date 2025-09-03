import math
import random
import pandas as pd
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from datetime import datetime

epoch = datetime(1970, 1, 1)

def generate_pdf_from_csv(csv_file, output_pdf):
    # Load data from CSV
    df = pd.read_csv(csv_file)

    # Compute statistics
    total_sales = df["Sales"].sum()
    avg_growth = df["Growth"].mean()
    total_users = df["Users"].sum()

    # Set up Jinja2 environment to load HTML template
    env = Environment(loader=FileSystemLoader("."))
    template = env.get_template("template.html")

    # Render the HTML with actual data
    html_content = template.render(
        total_sales=f"${total_sales:,.2f}",
        avg_growth=f"{avg_growth:.2f}%",
        total_users=f"{total_users:,}"
    )

    # Convert HTML to PDF
    HTML(string=html_content).write_pdf(output_pdf)
    print(f"PDF saved as {output_pdf}")

# Example usage
# generate_pdf_from_csv("sample_data.csv", "report.pdf")

def days_since_epoch(date):
    return (date - epoch).days

def get_day_val(row):
    sheet_date_val = row['Date of Assessment:']
    date = None

    if(isinstance(sheet_date_val, str)):
        dateStrings = row['Date of Assessment:'].split('/')
        date = datetime(int(dateStrings[2]), int(dateStrings[0]), int(dateStrings[1]))
    elif(isinstance(sheet_date_val, datetime)):
        date = sheet_date_val
    else:
        raise ValueError(f"sheet value type {type(sheet_date_val)} cannot be converted to a datetime object!")
    
    return days_since_epoch(date)

def check_income_increase(df):
    total_patients = 0
    increase_patients = 0
    for mrn in df["MRN"].unique():
        sub = df.loc[df['MRN'] == mrn]
        max_row = sub.loc[sub['day_int'].idxmax()]
        patient_increased = max_row["Gain or Increase in Income:"]

        total_patients += 1
        if patient_increased == "Yes":
            increase_patients += 1

    print(f"{round(increase_patients/total_patients * 100, 1)}% of patients gained or increased income.")

def date_to_str(date):
    return f'{str(date["month"]).zfill(2)}/{str(date["day"]).zfill(2)}/{date["year"]}'

def visit_n_months_after(date, n):
    return {
        "day": random.randint(1, 28),
        "month": (date["month"] + n - 1) % 12 + 1,
        "year": date["year"] + math.floor((date["month"] + n - 1) / 12),
    }

def add_random_person(df, n=1):
    # gets list of column names
    c = list(df.columns)

    # import names    
    with open("private/names/first-names.txt", "r") as file:
        data1 = file.read().split("\n")  # Split by newline
    fn_df = pd.DataFrame(data1, columns=["Values"])  # Create DataFrame

    with open("private/names/last-names.txt", "r") as file:
        data2 = file.read().split("\n")  # Split by newline
    ln_df = pd.DataFrame(data2, columns=["Values"])  # Create DataFrame

    # print(names_df.sample(1)["Values"])

    for i in range(n):
        # creates empty array
        toAdd = [0] * len(c)

        # sets patient name
        lname = ln_df.sample(1)["Values"].iloc[0]
        fname = fn_df.sample(1)["Values"].iloc[0]
        toAdd[c.index("Patient Name")] = f"{lname}, {fname}"
        toAdd[c.index("Participant Name:")] = f"{fname} {lname}"
        toAdd[c.index("Last Name")] = f"{lname}"
        toAdd[c.index("First Name")] = f"{fname}"

        first_visit = {"day": random.randint(1, 28), "month": random.randint(1, 12), "year": random.randint(2020, 2025)}

        toAdd[c.index("DOB")] = date_to_str({"month": random.randint(1,12), "day": random.randint(1,28), "year": random.randint(1980,2000)})

        toAdd[c.index("Sex")] = "Female"

        toAdd[c.index("Date of Entry")] = date_to_str(visit_n_months_after(first_visit, random.randint(-10,-1)))

        # sets mrn
        toAdd[c.index("MRN")] = i + 3

        # create 1-5 "visits" for a specified patient
        num_visits = random.randint(1,10)
        for i in range(num_visits):
            subAdd = toAdd[:]

            # format 01/31/2024
            date_of_assessment_str = date_to_str(visit_n_months_after(first_visit, i))
            subAdd[c.index("Date of Assessment:")] = date_of_assessment_str

            subAdd[c.index("Hours Worked")] = ["Unemployed", "0-9", "10-19", "20-29", "30-39", "40+"][random.randint(0,5)]

            subAdd[c.index("Hours in Education")] = ["No Education", "0-9", "10-19", "20-29", "30-39", "40+"][random.randint(0,5)]

            subAdd[c.index("Income ($):")] = random.randint(500,1500)

            adult_has_healthcare = random.random() < 0.9
            subAdd[c.index("Adult:")] = ["No", "Yes"][adult_has_healthcare]

            child_has_healthcare = random.random() < 0.9
            subAdd[c.index("Child:")] = ["No", "Yes"][child_has_healthcare]

            subBenefits = []

            for benefit in ['WIC', 'Food Stamps', 'ELRC', 'Medical Assistance']:
                if(random.random() > 0.5):
                    subBenefits.append(benefit)

            subAdd[c.index("What maintain or Increase Non-Cash Benefits:")] = ", ".join(subBenefits)

            if(i == num_visits - 1):
                exit_to_permanent_housing = random.random() < 0.80
                subAdd[c.index("Exits to Permanent Housing Destinations:")] = ["No", "Yes"][exit_to_permanent_housing]

                moved_out = random.random() < 0.40
                if(moved_out):
                    subAdd[c.index("Moved Out")] = "Yes"
                    subAdd[c.index("Moveout Date")] = date_of_assessment_str
                else:
                    subAdd[c.index("Moved Out")] = "No"

            df.loc[len(df)] = subAdd



def info_from_xlsx(xlsx_file):
    df = pd.read_excel(xlsx_file, sheet_name="New HEARTH Monthly Program Perf")

    df = df.iloc[0:0]
    
    add_random_person(df, 1000)

    #gets days since 1/1/1970 that the assessment was conducted
    df["day_int"] = df.apply(get_day_val, axis=1)

    df.to_excel('output.xlsx', index=False)
    # pd.ExcelWriter

info_from_xlsx("private/hearth_new.xlsx")

# print(visit_n_months_after({"month": 12, "day": 8, "year": 2004}, -1))