<?php 
	include('connection.php');
	if(isset($_POST['add_user'])){
		$fname = $_POST['fname'];
		$sname = $_POST['sname'];
		$email = $_POST['email'];
		$query = "INSERT INTO table1(firstname,surname,email) VALUES('$fname','$sname','$email')";
		if(mysqli_query($connection,$query)){
			echo "<script>alert('You have successfully added a new user!')</script>";
			header("Location:index.php");
		}else{
			echo "<script>alert('Failed to add new user!')</script>";
		}

	}
 ?>
 <!DOCTYPE html>
<html>
<head>
	<title>Add New User</title>
	<script type="text/javascript" src="js/jquery.js"></script>
	<script type="text/javascript" src="js/index.js"></script>
	<link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
</head>
<body>
	ph
	<div class="container">
		<div class="col-md-12">
			<div class="row">
				<div class="col-md-4"></div>
				<div class="col-md-4 jumbotron my-5">
					<h4 class="text-center my-2">Add New User</h4>
					<form method="post">
						<label>FirstName</label>
						<input type="text" name="fname" class="form-control" autocomplete="off" required>
						<label>Surname</label>
						<input type="text" name="sname" class="form-control" autocomplete="off" required>
						<label>Email</label>
						<input type="text" name="email" class="form-control" autocomplete="off" required>
						<input type="submit" name="add_user" value="Add New User" class="btn btn-success my-2">
					</form>
				</div>
				<div class="col-md-4"></div>
			</div>
		</div>
	</div>
</body>
</html>