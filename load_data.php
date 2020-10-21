<?php 
	include("connection.php");
	$query = "SELECT * FROM table1 ORDER BY id ASC";
	$res = mysqli_query($connection,$query);
	$output = "";
	$output .="
				<table class='table table-bordered table-striped'>
					<tr>
						<th>ID</th>
						<th>Firstname</th>
						<th>Surname</th>
						<th>Email</th>
						<th>Action</th>
					</tr>
				</table>
	";
	echo "<a href='addUser.php' class='btn btn-success my-3'>ADD USER</a>";
	if (mysqli_num_rows($res)<1) {
		$output .= "
			<tr>
				<td colspan='5' align='center'>NO DATA</td>
			</tr>
		";
	}
	while ($row=mysqli_fetch_array($res)) {
		$output .= "
			<table class='table'>
			<tr>
				<td>".$row['id']."</td>
				<td>".$row['firstname']."</td>
				<td>".$row['surname']."</td>
				<td>".$row['email']."</td>
				<td>
					<div class='col-md-12'>
						<div class='row'>
							<div class='col-md-6'>
								<a href='edit_user.php?id=".$row['id']."'><button class='btn btn-primary' id='".$row['id']."' name='edit_user'>EDIT</button></a>
							</div>
							<div class='col-md-6'>
								<button class='btn btn-danger' id='".$row['id']."' name='delete_user'>DELETE</button>
							</div>
						</div>
					</div>
				</td>
			</tr>
			</table>
		";
	}
	echo $output;
 ?>