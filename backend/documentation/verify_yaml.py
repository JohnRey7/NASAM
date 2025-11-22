import os
import sys

def verify_yaml_files(root_dir):
    has_errors = False
    print(f"Checking YAML files in {root_dir}...")
    
    try:
        import yaml
    except ImportError:
        print("Error: PyYAML is not installed. Please install it using 'pip install pyyaml'")
        sys.exit(1)

    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.yml') or filename.endswith('.yaml'):
                file_path = os.path.join(dirpath, filename)
                try:
                    with open(file_path, 'r') as f:
                        yaml.safe_load(f)
                    print(f"OK: {file_path}")
                except yaml.YAMLError as exc:
                    print(f"ERROR: {file_path}")
                    print(exc)
                    has_errors = True
                except Exception as e:
                    print(f"ERROR: {file_path}")
                    print(e)
                    has_errors = True
    
    if has_errors:
        print("\nValidation failed with errors.")
        sys.exit(1)
    else:
        print("\nAll YAML files are valid.")
        sys.exit(0)

if __name__ == "__main__":
    verify_yaml_files(os.path.dirname(os.path.abspath(__file__)))
