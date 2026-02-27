from setuptools import setup, find_packages

setup(
    name='ai-ppe-intrusion-detection',
    version='0.1.0',
    author='Your Name',
    author_email='your.email@example.com',
    description='AI-Based Far-Field Worker & PPE Intrusion Detection System',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=[
        'torch>=1.7.0',
        'opencv-python>=4.5.0',
        'PyYAML>=5.3',
        'numpy>=1.18.0',
        'matplotlib>=3.2.0',
        'scikit-learn>=0.22.0',
        'pandas>=1.0.0',
    ],
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)