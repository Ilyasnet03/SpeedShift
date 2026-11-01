UPDATE listings SET status = 'published' WHERE LOWER(status) = 'pending';
