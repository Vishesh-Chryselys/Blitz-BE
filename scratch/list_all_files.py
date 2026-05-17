import os

def list_files():
    base_dir = r"c:\Users\ShriyansJain\Blitz-BE\Data\Project Deliverables Repository\Client - Stemline (US)"
    if not os.path.exists(base_dir):
        print(f"Directory not found: {base_dir}")
        return
        
    print(f"Files inside '{base_dir}':")
    count = 0
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), base_dir)
            print(f"- {rel_path} ({os.path.getsize(os.path.join(root, file))} bytes)")
            count += 1
    print(f"Total files found: {count}")

if __name__ == "__main__":
    list_files()
