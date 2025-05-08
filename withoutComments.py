import numpy as np
import pandas as pd
import glob
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.preprocessing import RobustScaler
from scipy.stats.mstats import winsorize
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.combine import SMOTEENN
from collections import Counter
from imblearn.pipeline import Pipeline

file_paths = glob.glob(r"D:\PBL\TON_IoT Dataset\CSV Files\UNSW-NB15_*.csv")

file_path = r"D:\PBL\TON_IoT Dataset\CSV Files\NUSW-NB15_features.csv"

try:
    features_df = pd.read_csv(file_path, encoding="utf-8")
except UnicodeDecodeError:
    print("UTF-8 failed, trying alternative encodings...")
    try:
        features_df = pd.read_csv(file_path, encoding="latin1")
    except UnicodeDecodeError:
        features_df = pd.read_csv(file_path, encoding="cp1252")

print(features_df.head())

correct_columns = features_df["Name"].tolist()
correct_columns.append("label")

print("Correct Feature Names:", correct_columns)

df = pd.concat([pd.read_csv(file, names=correct_columns, skiprows=1, low_memory=False) for file in file_paths], ignore_index=True)

print(df.info())
print(df.head())

print("\nData Types Before Fixing:")
print(df.dtypes)

for col in df.select_dtypes(include=['object']).columns:
    try:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    except:
        pass

print("\nData Types After Fixing:")
print(df.dtypes)

categorical_columns = ['proto', 'state', 'service', 'attack_cat']

for col in categorical_columns:
    df[col] = df[col].astype(str)

print("\nUpdated Data Types:")
print(df.dtypes)

missing_values = df.isnull().sum()
missing_values = missing_values[missing_values > 0].sort_values(ascending=False)

print("\nColumns with Missing Values:\n", missing_values)

df.drop(columns=['srcip', 'dstip', 'ct_ftp_cmd', 'is_ftp_login', 'ct_flw_http_mthd'], inplace=True)

print("\nRemaining Columns:", df.columns)

print("\nUnique Values in attack_cat:")
print(df['attack_cat'].unique())

print("\nAttack Category Distribution:")
print(df['attack_cat'].value_counts())

original_file_paths = glob.glob(r"D:\PBL\TON_IoT Dataset\CSV Files\UNSW-NB15_*.csv")
df_original = pd.concat(
    [pd.read_csv(file, names=correct_columns, skiprows=1, low_memory=False) for file in original_file_paths],
    ignore_index=True
)

print("\nOriginal Unique Values in attack_cat:")
print(df_original['attack_cat'].unique())

print("\nOriginal Attack Category Distribution:")
print(df_original['attack_cat'].value_counts())

df['attack_cat'] = df_original['attack_cat']

print("\nRestored Unique Values in attack_cat:")
print(df['attack_cat'].unique())

df['attack_cat'] = df['attack_cat'].astype(str).str.strip()

df['attack_cat'].replace("nan", "Normal", inplace=True)
df['attack_cat'].replace("None", "Normal", inplace=True)

print("\nUpdated Attack Category Distribution:")
print(df['attack_cat'].value_counts())

df.loc[:, 'label'] = df['attack_cat'].apply(lambda x: 1 if x != "Normal" else 0)

print("\nLabel Distribution:")
print(df['label'].value_counts(normalize=True) * 100)

missing_values = df.isnull().sum()
missing_values = missing_values[missing_values > 0].sort_values(ascending=False)

print("\nColumns with Missing Values:\n", missing_values)

num_cols = df.select_dtypes(include=['float64', 'int64']).columns
df[num_cols] = df[num_cols].fillna(df[num_cols].median())

print("\nMissing Values After Fix:", df.isnull().sum().sum())

missing_values = df.isnull().sum().sum()
print("\nTotal Missing Values:", missing_values)

print("\nData Types Summary:")
print(df.dtypes.value_counts())

print("\nLabel Distribution:")
print(df['label'].value_counts(normalize=True) * 100)

duplicate_rows = df.duplicated().sum()
print("\nTotal Duplicate Rows:", duplicate_rows)

print("\nUnique Attack Categories:", df['attack_cat'].unique())

print("\nSummary Statistics:")
print(df.describe())

df.drop_duplicates(inplace=True)

print("\nTotal Duplicate Rows After Removal:", df.duplicated().sum())

df.drop(columns=['Label'], inplace=True, errors='ignore')

print("\nRemaining Columns:", df.columns)

missing_values = df.isnull().sum()
missing_values[missing_values > 0]

df.rename(columns={'ct_src_ ltm': 'ct_src_ltm'}, inplace=True)

print(df.columns)

df['sport'] = df['sport'].astype('int64')
df['dsport'] = df['dsport'].astype('int64')

print(df[['sport', 'dsport']].dtypes)

print(df[['proto', 'state', 'service', 'attack_cat']].nunique())

df['attack_cat'] = df['attack_cat'].replace({'Backdoor': 'Backdoors'})

print(df['attack_cat'].unique())

num_cols = df.select_dtypes(include=[np.number]).columns

Q1 = df[num_cols].quantile(0.25)
Q3 = df[num_cols].quantile(0.75)
IQR = Q3 - Q1

outliers = ((df[num_cols] < (Q1 - 1.5 * IQR)) | (df[num_cols] > (Q3 + 1.5 * IQR))).sum()
outliers[outliers > 0]

from sklearn.preprocessing import LabelEncoder

label_encoder = LabelEncoder()

df['attack_cat_label'] = label_encoder.fit_transform(df['attack_cat'])

label_mapping = dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_)))
print(label_mapping)

df = pd.get_dummies(df, columns=['attack_cat'], prefix='attack')

from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler()

num_cols = df.select_dtypes(include=['float64', 'int64']).columns
num_cols = num_cols.drop(['label', 'attack_cat_label'])

df[num_cols] = scaler.fit_transform(df[num_cols])

num_cols = df.select_dtypes(include=[np.number]).columns

Q1 = df[num_cols].quantile(0.25)
Q3 = df[num_cols].quantile(0.75)
IQR = Q3 - Q1

outliers = ((df[num_cols] < (Q1 - 1.5 * IQR)) | (df[num_cols] > (Q3 + 1.5 * IQR))).sum()

outliers[outliers > 0]

outlier_cols = ['dsport', 'dur', 'sbytes', 'dbytes', 'sttl', 'dttl', 'sloss', 'dloss',
                'Sload', 'Dload', 'Spkts', 'Dpkts', 'smeansz', 'dmeansz', 'trans_depth',
                'res_bdy_len', 'Sjit', 'Djit', 'Sintpkt', 'Dintpkt', 'tcprtt', 'synack',
                'ackdat', 'is_sm_ips_ports', 'ct_state_ttl', 'ct_srv_src', 'ct_srv_dst',
                'ct_dst_ltm', 'ct_src_ltm', 'ct_src_dport_ltm', 'ct_dst_sport_ltm',
                'ct_dst_src_ltm']

q1 = df[outlier_cols].quantile(0.01)
q99 = df[outlier_cols].quantile(0.99)

df[outlier_cols] = df[outlier_cols].clip(lower=q1, upper=q99, axis=1)

((df[outlier_cols] < q1) | (df[outlier_cols] > q99)).sum()

for col in ['proto', 'state', 'service']:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])

X = df.drop(columns=['label'])
y = df['label']

smote = SMOTE(sampling_strategy=0.5, random_state=42)
undersample = RandomUnderSampler(sampling_strategy=0.8, random_state=42)

pipeline = Pipeline([('smote', smote), ('undersample', undersample)])

X_resampled, y_resampled = pipeline.fit_resample(X, y)

print("Original Class Distribution:", Counter(y))
print("New Class Distribution:", Counter(y_resampled))

corr_matrix = df.corr().abs()

upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))

to_drop = [column for column in upper.columns if any(upper[column] > 0.9)]

print("Highly Correlated Features to Drop:", to_drop)

df = df.drop(columns=to_drop)

dropped_correlated_features = list(set(df_original.columns) - set(df.columns))

print("Correlated Features Dropped:", dropped_correlated_features)

from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(n_estimators=100, random_state=42)

rf.fit(X_resampled, y_resampled)

feature_importances = pd.Series(rf.feature_importances_, index=X_resampled.columns).sort_values(ascending=False)

print(feature_importances.head(20))

low_importance_features = feature_importances[feature_importances < 0.001].index

existing_low_importance_features = [f for f in low_importance_features if f in df.columns]

df = df.drop(columns=existing_low_importance_features)

if 'dwin' in feature_importances:
    print(f"'dwin' Importance: {feature_importances['dwin']}")
else:
    print("'dwin' was removed before feature importance calculation.")

low_importance_features = feature_importances[feature_importances < 0.001].index.tolist()

correlated_features_dropped = ['is_ftp_login', 'srcip', 'ct_ftp_cmd', 'ct_src_ ltm', 'ackdat',
                               'attack_cat', 'dwin', 'Ltime', 'dstip', 'synack',
                               'tcprtt', 'Label', 'Spkts', 'dloss', 'ct_flw_http_mthd', 'Dpkts']

features_to_drop = [col for col in low_importance_features if col in df.columns]

df = df.drop(columns=features_to_drop)

print(f"Successfully dropped features: {features_to_drop}")

print(df.isnull().sum().sum())

print(df.dtypes)

print(f"Dataset Shape: {df.shape}")
print(df['label'].value_counts(normalize=True))

print(df.columns)
df['attack_cat_label'].value_counts()

print(df.info())
print(df.head())
print(df.describe())

print(df.columns)

df.to_csv("UNSW_NB15_Cleaned.csv", index=False)

print("Dataset saved as UNSW_NB15_Cleaned.csv")

print(f"Total Records: {df.shape[0]}")
print(f"Total Features: {df.shape[1]}")

print("\nClass Distribution:")
print(df['label'].value_counts())

df.head()

print("Original Class Distribution:", Counter(df['label']))

print("Resampled Class Distribution:", Counter(y_resampled))

original_counts = [1959340, 98866]
resampled_counts = [1224587, 979670]
labels = ['Normal', 'Attack']

fig, axes = plt.subplots(1, 2, figsize=(12, 6))

axes[0].pie(original_counts, labels=labels, autopct='%1.1f%%', colors=['lightblue', 'red'])
axes[0].set_title("Original Class Distribution")

axes[1].pie(resampled_counts, labels=labels, autopct='%1.1f%%', colors=['lightblue', 'red'])
axes[1].set_title("Resampled Class Distribution (SMOTE & Undersampling)")

plt.show()

print(df.describe())

print("\nMissing Values:\n", df.isnull().sum())

print("\nFeature Types:\n", df.dtypes.value_counts())

plt.figure(figsize=(12, 8))
sns.heatmap(df.corr(), cmap='coolwarm', annot=False, linewidths=0.5)
plt.title("Feature Correlation Heatmap")
plt.show()

df.hist(figsize=(12, 10), bins=50)
plt.suptitle("Feature Distributions", fontsize=16)
plt.show()

df_sample = df.sample(n=5000, random_state=42)
df_sample.plot(kind='density', subplots=True, layout=(5,5), figsize=(15,12), sharex=False)
plt.suptitle("Feature Density Plots", fontsize=16)
plt.show()
